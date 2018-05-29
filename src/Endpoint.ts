export default abstract class Endpoint {
  /**
   * @description Which group this endpoint belongs to
  */
  abstract group(): string;

  /**
   * @description Name of the endpoint
  */
  abstract name(): string;

  /**
   * @description Function that will be called once api.$.group.name() is called.
   * This class will be bounded, so the following methods:
   * this.get, this.post, this.put, this.patch, this.delete
   * will be available here for usage
  */
  abstract call(): Promise<any>;
}
